'''
Business: Простая функция для чтения и записи данных сотрудников
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with request_id
Returns: HTTP response dict
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    try:
        params = event.get('queryStringParameters') or {}
        restaurant = params.get('restaurant', 'port').replace("'", "''")
        
        cur.execute(f"SELECT id FROM restaurants WHERE name = '{restaurant}'")
        rest_data = cur.fetchone()
        
        if not rest_data:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'employees': []})}
        
        restaurant_id = rest_data['id']
        
        cur.execute(f"""
            SELECT 
                e.id, e.name,
                ui.item_type, ui.size,
                json_agg(
                    json_build_object('month', mr.month, 'condition', mr.condition, 'issueDate', mr.issue_date)
                    ORDER BY mr.month
                ) FILTER (WHERE mr.id IS NOT NULL) as records
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
            emp_id = row['id']
            if emp_id not in employees_dict:
                employees_dict[emp_id] = {
                    'id': emp_id,
                    'name': row['name'],
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
                    'monthlyRecords': row['records'] if row['records'] else []
                }
        
        employees = list(employees_dict.values())
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'employees': employees})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e), 'employees': []})
        }
    finally:
        cur.close()
        conn.close()