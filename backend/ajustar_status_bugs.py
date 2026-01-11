import sqlite3

db_path = 'backend/bugs.db'

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Corrige todos os status para minúsculo conforme o Enum
status_map = {
	'Aberto': 'aberto',
	'Fechado': 'fechado',
	'Reaberto': 'reaberto',
	'Em andamento': 'em andamento',
	'Pendente': 'pendente',
	'Cancelado': 'cancelado',
	'Novo': 'aberto',
	'novo': 'aberto',
}
for old, new in status_map.items():
	cursor.execute("UPDATE bugs SET status = ? WHERE status = ?", (new, old))
conn.commit()

print('Registros atualizados com sucesso!')

conn.close()
