#!/bin/bash

# Script to push to GitHub using Personal Access Token
# Usage: ./push-with-token.sh

REPO_NAME="ios-app-gemini"
GITHUB_USERNAME="danieltjaarda"

echo "🚀 Pushing code to GitHub..."
echo ""
echo "You need a GitHub Personal Access Token to push."
echo ""
echo "If you don't have one, create it here:"
echo "https://github.com/settings/tokens/new"
echo ""
echo "Required scopes: repo"
echo ""

read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

# Set remote with token
git remote remove origin 2>/dev/null
git remote add origin https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

# Push
echo "Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "Repository: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    
    # Remove token from remote URL for security
    git remote set-url origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git
    echo ""
    echo "✅ Token removed from git config for security"
else
    echo ""
    echo "❌ Failed to push. Please check your token and try again."
    exit 1
fi

