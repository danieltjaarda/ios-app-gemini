#!/bin/bash

# Script to create GitHub repository and push code
# Usage: ./create-and-push-repo.sh

REPO_NAME="ios-app-gemini"
GITHUB_USERNAME="danieltjaarda"

echo "🚀 Creating GitHub repository and pushing code..."
echo ""

# Check if GitHub token is available
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  No GITHUB_TOKEN found in environment."
    echo ""
    echo "Please create the repository manually:"
    echo "1. Go to: https://github.com/new"
    echo "2. Repository name: ${REPO_NAME}"
    echo "3. Choose Public or Private"
    echo "4. DO NOT initialize with README, .gitignore, or license"
    echo "5. Click 'Create repository'"
    echo ""
    read -p "Press Enter after you've created the repository..."
    echo ""
    
    # Add remote and push
    echo "Adding remote and pushing..."
    git remote remove origin 2>/dev/null
    git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo "Repository: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
    else
        echo ""
        echo "❌ Failed to push. Please check:"
        echo "1. Repository exists on GitHub"
        echo "2. You have push access"
        echo "3. Your GitHub credentials are correct"
    fi
else
    echo "Using GitHub API to create repository..."
    
    # Create repository via API
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"${REPO_NAME}\",\"private\":false}")
    
    if echo "$RESPONSE" | grep -q '"id"'; then
        echo "✅ Repository created successfully!"
        
        # Add remote and push
        git remote remove origin 2>/dev/null
        git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git
        git push -u origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Successfully pushed to GitHub!"
            echo "Repository: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
        else
            echo "❌ Failed to push code"
        fi
    else
        echo "❌ Failed to create repository"
        echo "Response: $RESPONSE"
        echo ""
        echo "Please create it manually at: https://github.com/new"
    fi
fi

