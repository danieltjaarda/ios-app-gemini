#!/bin/bash

# Script to push to GitHub
# Make sure you've created the repository on GitHub first

REPO_NAME="ios-app-gemini"
GITHUB_USERNAME=$(git config user.name 2>/dev/null || echo "YOUR_GITHUB_USERNAME")

echo "Setting up GitHub remote..."
echo "Please make sure you've created the repository '${REPO_NAME}' on GitHub first!"
echo ""
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Is the repository private? (y/n): " IS_PRIVATE

if [ "$IS_PRIVATE" = "y" ]; then
    REPO_URL="git@github.com:${GITHUB_USERNAME}/${REPO_NAME}.git"
else
    REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
fi

git remote add origin ${REPO_URL} 2>/dev/null || git remote set-url origin ${REPO_URL}
git push -u origin main

echo ""
echo "✅ Pushed to GitHub!"
echo "Repository: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"

