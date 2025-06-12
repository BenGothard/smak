#!/usr/bin/env bash
set -e

# Install Node.js LTS from distribution packages
sudo apt-get update
sudo apt-get install -y nodejs

# Install Python dependencies
python -m pip install --upgrade pip
pip install pygame flake8

# Install Node dependencies
npm ci
