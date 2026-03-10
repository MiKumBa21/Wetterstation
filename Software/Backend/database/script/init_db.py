import sqlite3 
import os
import sys
sys.path.insert(0,"../../../Backend")
import log

db_path = "../WtterstaionData.db"

def init_DB():

    con = sqlite3.connect(db_path)
    cur = con.cursor()
    cur.execute("PRAGMA foreign_keys = ON;")
    cur.execute("PRAGMA journal_mode = WAL;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sensor (
            sensor_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
            name TEXT NOT NULL UNIQUE, 
            typ TEXT NOT NULL
        );""")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS dataTyp (
            typ_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
            name TEXT NOT NULL UNIQUE, 
            einheit TEXT NOT NULL
        );""")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS messwert (
            messwert_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            sensor_id INTEGER NOT NULL,
            dataTyp_id INTEGER NOT NULL,
            wert REAL NOT NULL,
            zeitstempel DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id),
            FOREIGN KEY (dataTyp_id) REFERENCES dataTyp(typ_id)
        );""")
    cur.execute("""


    """)

    con.commit()
    con.close()

init_DB()