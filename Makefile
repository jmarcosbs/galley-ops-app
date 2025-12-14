.PHONY: build deploy nginx-check nginx-reload all

# Diretório de destino no servidor
DEST_DIR=/var/www/pedidos.restaurantemarinheiros.com.br

build:
	npm run build

deploy:
	sudo rsync -av --delete out/ $(DEST_DIR)/

nginx-check:
	sudo nginx -t

nginx-reload:
	sudo systemctl reload nginx

all: build deploy nginx-check nginx-reload
