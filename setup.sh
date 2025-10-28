#!/bin/bash

# Create data directory
mkdir -p data

# Create keystore directory
mkdir -p data/keystore

# Create .gitkeep file in keystore directory
touch data/keystore/.gitkeep

# Create password file (you should change this to a secure password)
echo "insecure-password" > data/password.txt

# Create static nodes file
echo "[]" > data/static-nodes.json

echo "Setup complete. You can now run the migration script or start the node with docker-compose."