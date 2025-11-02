import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "airbnb_db"),
    "port": int(os.getenv("DB_PORT", 3306))
}

# Create connection pool
try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="airbnb_pool",
        pool_size=5,
        **db_config
    )
    print("✅ Successfully created MySQL connection pool")
except mysql.connector.Error as err:
    print(f"❌ Error creating connection pool: {err}")
    connection_pool = None

def get_db_connection():
    """Get a connection from the pool"""
    if connection_pool:
        return connection_pool.get_connection()
    return None

def test_connection():
    """Test database connection"""
    try:
        conn = get_db_connection()
        if conn and conn.is_connected():
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            conn.close()
            return True
    except Exception as e:
        print(f"Database connection test failed: {e}")
    return False