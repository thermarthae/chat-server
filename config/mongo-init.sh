#!/usr/bin/env bash
echo 'Creating application user and db'
set -e

"${mongo[@]}" "$MONGO_INITDB_DATABASE" <<-EOJS
	db.createUser({
		user: $(_js_escape "$MONGO_NODE_CLIENT_USERNAME"),
		pwd: $(_js_escape "$MONGO_NODE_CLIENT_PASSWORD"),
		roles: [
			{
				role: 'readWrite',
				db: $(_js_escape "$MONGO_INITDB_DATABASE")
			}
		]
	})
EOJS