import json
import os
from typing import Dict, Any

import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage chats, groups, and messages
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict with chats or messages data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    db_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(db_url)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            user_id = params.get('user_id')
            chat_id = params.get('chat_id')
            
            if chat_id:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT m.id, m.content, m.created_at, 
                               u.id as user_id, u.username, u.avatar_url
                        FROM messages m
                        JOIN users u ON m.user_id = u.id
                        WHERE m.chat_id = %s
                        ORDER BY m.created_at ASC
                    """, (chat_id,))
                    messages = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps([dict(m) for m in messages], default=str)
                    }
            
            elif user_id:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT DISTINCT c.id, c.name, c.is_group, c.avatar_url, c.created_at,
                               (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                               (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
                        FROM chats c
                        JOIN chat_members cm ON c.id = cm.chat_id
                        WHERE cm.user_id = %s
                        ORDER BY last_message_time DESC NULLS LAST
                    """, (user_id,))
                    chats = cur.fetchall()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps([dict(c) for c in chats], default=str)
                    }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_chat':
                name = body.get('name')
                is_group = body.get('is_group', False)
                created_by = body.get('created_by')
                members = body.get('members', [])
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "INSERT INTO chats (name, is_group) VALUES (%s, %s) RETURNING id, name, is_group, avatar_url, created_at",
                        (name, is_group)
                    )
                    chat = cur.fetchone()
                    chat_id = chat['id']
                    
                    for member_id in members:
                        cur.execute(
                            "INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)",
                            (chat_id, member_id)
                        )
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps(dict(chat), default=str)
                    }
            
            elif action == 'send_message':
                chat_id = body.get('chat_id')
                user_id = body.get('user_id')
                content = body.get('content')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "INSERT INTO messages (chat_id, user_id, content) VALUES (%s, %s, %s) RETURNING id, chat_id, user_id, content, created_at",
                        (chat_id, user_id, content)
                    )
                    message = cur.fetchone()
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps(dict(message), default=str)
                    }
        
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        conn.close()