#!/bin/bash
# Script de build para Render

echo "🔨 Instalando dependencias del backend..."
npm install

echo "🔨 Instalando dependencias del frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build completado"

