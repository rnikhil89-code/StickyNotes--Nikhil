// GitHub Storage Configuration
// IMPORTANT: Create a personal access token at https://github.com/settings/tokens
// Then fill in your values below

const GITHUB_CONFIG = {
  owner: "your-github-username",        // e.g., "john-doe"
  repo: "daily-sticky-board",            // Repository name
  token: "ghp_xxxxxxxxxxxxxxxxxxxxxxx",   // Personal Access Token (keep secret!)
  branch: "main"
};

async function initializeGitHub() {
  try {
    // Verify token and repo exist
    if (!GITHUB_CONFIG.token || GITHUB_CONFIG.token.includes("xxx")) {
      console.warn("GitHub config not set up. Tasks will use localStorage only.");
      return false;
    }
    
    const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`, {
      headers: {
        "Authorization": `token ${GITHUB_CONFIG.token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });
    
    if (response.ok) {
      console.log("GitHub connected!");
      return true;
    } else {
      console.warn("GitHub repo not found or token invalid");
      return false;
    }
  } catch (error) {
    console.warn("GitHub initialization failed:", error.message);
    return false;
  }
}

async function saveTasksToGitHub(dateKey, tasks) {
  try {
    const fileName = `tasks/${dateKey}.json`;
    const content = JSON.stringify(tasks, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    // Get existing file SHA (needed for updates)
    let sha = null;
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${fileName}`,
        {
          headers: {
            "Authorization": `token ${GITHUB_CONFIG.token}`,
            "Accept": "application/vnd.github.v3+json"
          }
        }
      );
      
      if (getResponse.ok) {
        const data = await getResponse.json();
        sha = data.sha;
      }
    } catch (e) {
      // File doesn't exist yet, that's ok
    }
    
    // Put file (create or update)
    const putResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${fileName}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `token ${GITHUB_CONFIG.token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Update tasks for ${dateKey}`,
          content: encodedContent,
          branch: GITHUB_CONFIG.branch,
          ...(sha ? { sha } : {})
        })
      }
    );
    
    return putResponse.ok;
  } catch (error) {
    console.error("Error saving to GitHub:", error);
    return false;
  }
}

async function loadTasksFromGitHub(dateKey) {
  try {
    const fileName = `tasks/${dateKey}.json`;
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${fileName}`,
      {
        headers: {
          "Authorization": `token ${GITHUB_CONFIG.token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const content = JSON.parse(atob(data.content));
      return Array.isArray(content) ? content : [];
    }
    
    return [];
  } catch (error) {
    console.error("Error loading from GitHub:", error);
    return [];
  }
}

async function loadAllTasksFromGitHub() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/tasks`,
      {
        headers: {
          "Authorization": `token ${GITHUB_CONFIG.token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      }
    );
    
    if (!response.ok) return {};
    
    const files = await response.json();
    const notesByDate = {};
    
    for (const file of files) {
      if (file.name.endsWith(".json")) {
        const dateKey = file.name.replace(".json", "");
        const tasks = await loadTasksFromGitHub(dateKey);
        if (tasks.length > 0) {
          notesByDate[dateKey] = tasks;
        }
      }
    }
    
    return notesByDate;
  } catch (error) {
    console.error("Error loading all tasks from GitHub:", error);
    return {};
  }
}

async function saveUserPreferencesToGitHub(view, selectedDate) {
  try {
    const fileName = "preferences.json";
    const content = JSON.stringify({ view, selectedDate, updatedAt: new Date().toISOString() }, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    
    let sha = null;
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${fileName}`,
        {
          headers: {
            "Authorization": `token ${GITHUB_CONFIG.token}`,
            "Accept": "application/vnd.github.v3+json"
          }
        }
      );
      
      if (getResponse.ok) {
        const data = await getResponse.json();
        sha = data.sha;
      }
    } catch (e) {
      // File doesn't exist yet
    }
    
    const putResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${fileName}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `token ${GITHUB_CONFIG.token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Update user preferences",
          content: encodedContent,
          branch: GITHUB_CONFIG.branch,
          ...(sha ? { sha } : {})
        })
      }
    );
    
    return putResponse.ok;
  } catch (error) {
    console.error("Error saving preferences to GitHub:", error);
    return false;
  }
}

async function loadUserPreferencesFromGitHub() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/preferences.json`,
      {
        headers: {
          "Authorization": `token ${GITHUB_CONFIG.token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return JSON.parse(atob(data.content));
    }
    
    return { view: "week", selectedDate: null };
  } catch (error) {
    console.error("Error loading preferences from GitHub:", error);
    return { view: "week", selectedDate: null };
  }
}
