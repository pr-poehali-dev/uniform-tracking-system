'''
Business: Простая функция для работы с базой данных сотрудников
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with request_id
Returns: HTTP response dict
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action', '')
            restaurant = params.get('restaurant', 'port')
            
            if action == 'get_employees':
                restaurant_safe = restaurant.replace("'", "''")
                
                cur.execute(f"SELECT id FROM restaurants WHERE name = '{restaurant_safe}'")
                restaurant_data = cur.fetchone()
                
                if not restaurant_data:
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'employees': []})
                    }
                
                restaurant_id = restaurant_data['id']
                
                cur.execute(f"""
                    SELECT 
                        e.id as employee_id,
                        e.name as employee_name,
                        ui.id as uniform_item_id,
                        ui.item_type,
                        ui.size,
                        json_agg(
                            json_build_object(
                                'month', mr.month,
                                'condition', mr.condition,
                                'issueDate', mr.issue_date
                            ) ORDER BY mr.month
                        ) FILTER (WHERE mr.id IS NOT NULL) as monthly_records
                    FROM employees e
                    LEFT JOIN uniform_items ui ON ui.employee_id = e.id
                    LEFT JOIN monthly_records mr ON mr.uniform_item_id = ui.id
                    WHERE e.restaurant_id = {restaurant_id}
                    GROUP BY e.id, e.name, ui.id, ui.item_type, ui.size
                    ORDER BY e.id, ui.item_type
                """)
                
                rows = cur.fetchall()
                
                employees_dict = {}
                for row in rows:
                    emp_id = row['employee_id']
                    if emp_id not in employees_dict:
                        employees_dict[emp_id] = {
                            'id': emp_id,
                            'name': row['employee_name'],
                            'uniform': {
                                'tshirt': {'type': 'tshirt', 'size': 'M', 'monthlyRecords': []},
                                'pants': {'type': 'pants', 'size': '2', 'monthlyRecords': []},
                                'jacket': {'type': 'jacket', 'size': '2', 'monthlyRecords': []},
                                'badge': {'type': 'badge', 'size': 'needed', 'monthlyRecords': []}
                            }
                        }
                    
                    if row['item_type']:
                        employees_dict[emp_id]['uniform'][row['item_type']] = {
                            'type': row['item_type'],
                            'size': row['size'],
                            'monthlyRecords': row['monthly_records'] if row['monthly_records'] else []
                        }
                
                employees = list(employees_dict.values())
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'employees': employees})
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', '')
            
            if action == 'create_employee':
                restaurant = body_data.get('restaurant', 'port')
                employee_name = body_data.get('name', '')
                
                if not employee_name:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Name required'})
                    }
                
                restaurant_safe = restaurant.replace("'", "''")
                name_safe = employee_name.replace("'", "''")
                
                cur.execute(f"SELECT id FROM restaurants WHERE name = '{restaurant_safe}'")
                restaurant_data = cur.fetchone()
                
                if not restaurant_data:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Restaurant not found'})
                    }
                
                restaurant_id = restaurant_data['id']
                
                cur.execute(f"""
                    INSERT INTO employees (restaurant_id, name)
                    VALUES ({restaurant_id}, '{name_safe}')
                    RETURNING id
                """)
                
                employee_id = cur.fetchone()['id']
                
                uniform_items = [
                    ('tshirt', 'M'),
                    ('pants', '2'),
                    ('jacket', '2'),
                    ('badge', 'needed')
                ]
                
                for item_type, size in uniform_items:
                    cur.execute(f"""
                        INSERT INTO uniform_items (employee_id, item_type, size)
                        VALUES ({employee_id}, '{item_type}', '{size}')
                        ON CONFLICT (employee_id, item_type) DO NOTHING
                    """)
                
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({'id': employee_id, 'name': employee_name})
                }
            
            elif action == 'update_employee':
                employee_id = body_data.get('employeeId')
                uniform = body_data.get('uniform', {})
                
                if not employee_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Employee ID required'})
                    }
                
                for item_type, item_data in uniform.items():
                    size = item_data.get('size', '')
                    monthly_records = item_data.get('monthlyRecords', [])
                    
                    size_safe = str(size).replace("'", "''")
                    
                    cur.execute(f"""
                        INSERT INTO uniform_items (employee_id, item_type, size)
                        VALUES ({employee_id}, '{item_type}', '{size_safe}')
                        ON CONFLICT (employee_id, item_type)
                        DO UPDATE SET size = EXCLUDED.size
                        RETURNING id
                    """)
                    
                    uniform_item_id = cur.fetchone()['id']
                    
                    for record in monthly_records:
                        month = record.get('month', '').replace("'", "''")
                        condition = record.get('condition', '').replace("'", "''")
                        issue_date = record.get('issueDate')
                        
                        issue_date_sql = f"'{issue_date.replace(chr(39), chr(39)+chr(39))}'" if issue_date else 'NULL'
                        
                        cur.execute(f"""
                            INSERT INTO monthly_records (uniform_item_id, month, condition, issue_date)
                            VALUES ({uniform_item_id}, '{month}', '{condition}', {issue_date_sql})
                            ON CONFLICT (uniform_item_id, month)
                            DO UPDATE SET 
                                condition = EXCLUDED.condition,
                                issue_date = EXCLUDED.issue_date,
                                updated_at = CURRENT_TIMESTAMP
                        """)
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'delete_employee':
                employee_id = body_data.get('employeeId')
                
                if not employee_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Employee ID required'})
                    }
                
                cur.execute(f"DELETE FROM employees WHERE id = {employee_id}")
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True})
                }
        
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid action'})
        }
        
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        cur.close()
        conn.close()
