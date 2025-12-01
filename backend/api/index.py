'''
Business: REST API для управления данными сотрудников в реальном времени
Args: event с httpMethod, body, queryStringParameters
Returns: JSON с данными сотрудников
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            restaurant = (event.get('queryStringParameters') or {}).get('restaurant', 'port')
            
            cur.execute(f"SELECT id FROM restaurants WHERE name = '{restaurant.replace(chr(39), chr(39)+chr(39))}'")
            rest = cur.fetchone()
            
            if not rest:
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'employees': []})}
            
            cur.execute(f"""
                SELECT e.id, e.name, ui.item_type, ui.size,
                    json_agg(json_build_object('month', mr.month, 'condition', mr.condition, 'issueDate', mr.issue_date) ORDER BY mr.month) 
                    FILTER (WHERE mr.id IS NOT NULL) as records
                FROM employees e
                LEFT JOIN uniform_items ui ON ui.employee_id = e.id
                LEFT JOIN monthly_records mr ON mr.uniform_item_id = ui.id
                WHERE e.restaurant_id = {rest['id']}
                GROUP BY e.id, e.name, ui.id, ui.item_type, ui.size
                ORDER BY e.id, ui.item_type
            """)
            
            rows = cur.fetchall()
            emps = {}
            
            for row in rows:
                eid = row['id']
                if eid not in emps:
                    emps[eid] = {
                        'id': eid, 'name': row['name'],
                        'uniform': {
                            'tshirt': {'type': 'tshirt', 'size': 'M', 'monthlyRecords': []},
                            'pants': {'type': 'pants', 'size': '2', 'monthlyRecords': []},
                            'jacket': {'type': 'jacket', 'size': '2', 'monthlyRecords': []},
                            'badge': {'type': 'badge', 'size': 'needed', 'monthlyRecords': []}
                        }
                    }
                
                if row['item_type']:
                    emps[eid]['uniform'][row['item_type']] = {
                        'type': row['item_type'],
                        'size': row['size'],
                        'monthlyRecords': row['records'] or []
                    }
            
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'employees': list(emps.values())})}
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            restaurant = data.get('restaurant', 'port')
            name = data.get('name', '')
            
            cur.execute(f"SELECT id FROM restaurants WHERE name = '{restaurant.replace(chr(39), chr(39)+chr(39))}'")
            rest = cur.fetchone()
            
            if not rest:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Restaurant not found'})}
            
            cur.execute(f"INSERT INTO employees (restaurant_id, name) VALUES ({rest['id']}, '{name.replace(chr(39), chr(39)+chr(39))}') RETURNING id")
            emp_id = cur.fetchone()['id']
            
            for item_type, size in [('tshirt', 'M'), ('pants', '2'), ('jacket', '2'), ('badge', 'needed')]:
                cur.execute(f"INSERT INTO uniform_items (employee_id, item_type, size) VALUES ({emp_id}, '{item_type}', '{size}') ON CONFLICT DO NOTHING")
            
            conn.commit()
            return {'statusCode': 201, 'headers': headers, 'body': json.dumps({'id': emp_id, 'name': name})}
        
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            emp_id = data.get('employeeId')
            uniform = data.get('uniform', {})
            
            for item_type, item_data in uniform.items():
                size = str(item_data.get('size', '')).replace(chr(39), chr(39)+chr(39))
                
                cur.execute(f"""
                    INSERT INTO uniform_items (employee_id, item_type, size) 
                    VALUES ({emp_id}, '{item_type}', '{size}')
                    ON CONFLICT (employee_id, item_type) DO UPDATE SET size = EXCLUDED.size
                    RETURNING id
                """)
                ui_id = cur.fetchone()['id']
                
                for rec in item_data.get('monthlyRecords', []):
                    month = rec.get('month', '').replace(chr(39), chr(39)+chr(39))
                    cond = rec.get('condition', '').replace(chr(39), chr(39)+chr(39))
                    issue = rec.get('issueDate')
                    issue_sql = f"'{issue.replace(chr(39), chr(39)+chr(39))}'" if issue else 'NULL'
                    
                    cur.execute(f"""
                        INSERT INTO monthly_records (uniform_item_id, month, condition, issue_date)
                        VALUES ({ui_id}, '{month}', '{cond}', {issue_sql})
                        ON CONFLICT (uniform_item_id, month) DO UPDATE SET condition = EXCLUDED.condition, issue_date = EXCLUDED.issue_date
                    """)
            
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}
        
        elif method == 'DELETE':
            emp_id = (event.get('queryStringParameters') or {}).get('id')
            if emp_id:
                cur.execute(f"DELETE FROM employees WHERE id = {emp_id}")
                conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}
        
        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}
        
    except Exception as e:
        conn.rollback()
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}
    finally:
        cur.close()
        conn.close()
