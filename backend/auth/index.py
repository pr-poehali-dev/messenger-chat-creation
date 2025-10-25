import json
import os
import hashlib
import secrets
from typing import Dict, Any

import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User registration and authentication
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict with user data or auth token
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                email = body.get('email')
                password = body.get('password')
                username = body.get('username')
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "INSERT INTO users (email, password_hash, username) VALUES (%s, %s, %s) RETURNING id, email, username, avatar_url, created_at",
                        (email, password_hash, username)
                    )
                    user = cur.fetchone()
                    conn.commit()
                    
                    auth_token = secrets.token_urlsafe(32)
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'user': dict(user),
                            'token': auth_token
                        }, default=str)
                    }
            
            elif action == 'login':
                email = body.get('email')
                password = body.get('password')
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "SELECT id, email, username, avatar_url, created_at FROM users WHERE email = %s AND password_hash = %s",
                        (email, password_hash)
                    )
                    user = cur.fetchone()
                    
                    if not user:
                        return {
                            'statusCode': 401,
                            'headers': {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            },
                            'body': json.dumps({'error': 'Invalid credentials'})
                        }
                    
                    auth_token = secrets.token_urlsafe(32)
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'user': dict(user),
                            'token': auth_token
                        }, default=str)
                    }
            
            elif action == 'update_profile':
                user_id = body.get('user_id')
                username = body.get('username')
                avatar_url = body.get('avatar_url')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "UPDATE users SET username = %s, avatar_url = %s WHERE id = %s RETURNING id, email, username, avatar_url, created_at",
                        (username, avatar_url, user_id)
                    )
                    user = cur.fetchone()
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'user': dict(user)}, default=str)
                    }
        
        elif method == 'GET':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT id, email, username, avatar_url FROM users")
                users = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps([dict(u) for u in users], default=str)
                }
        
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        conn.close()