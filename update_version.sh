#!/bin/bash

# Script para atualizar versão de cache dos arquivos estáticos
# Uso: ./update_version.sh

# Gera nova versão baseada na data e hora atual (YYYYMMDDHHMM)
NEW_VERSION=$(date +%Y%m%d%H%M)

echo "=========================================="
echo "  Atualizador de Versão - Cache Busting"
echo "=========================================="
echo ""
echo "Nova versão: $NEW_VERSION"
echo ""

# Atualizar versões no index.html
sed -i "s/\?v=[0-9]\{10,12\}/?v=$NEW_VERSION/g" index.html

echo "✓ Versões atualizadas no index.html"
echo ""

# Mostrar as linhas atualizadas
echo "Linhas atualizadas:"
grep "?v=" index.html

echo ""
echo "=========================================="
echo "  Próximos passos:"
echo "=========================================="
echo "1. Commit e push para o GitHub"
echo "2. Upload dos arquivos para a Hostinger"
echo "3. Limpar cache do navegador (Ctrl+Shift+Del)"
echo "4. Testar com Ctrl+F5 (hard refresh)"
echo ""
