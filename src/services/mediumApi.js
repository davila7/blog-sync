import axios from 'axios';

const MEDIUM_API_BASE_URL = 'https://api.medium.com/v1';

class MediumApiService {
  constructor() {
    this.accessToken = import.meta.env.VITE_MEDIUM_ACCESS_TOKEN;
    
    this.client = axios.create({
      baseURL: MEDIUM_API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
      }
    });
  }

  async getCurrentUser() {
    try {
      const response = await this.client.get('/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw new Error(`Failed to fetch user data: ${error.response?.data?.message || error.message}`);
    }
  }

  async getUserPosts(userId) {
    try {
      const response = await this.client.get(`/users/${userId}/posts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw new Error(`Failed to fetch posts: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPublications() {
    try {
      const user = await this.getCurrentUser();
      const response = await this.client.get(`/users/${user.data.id}/publications`);
      return response.data;
    } catch (error) {
      console.error('Error fetching publications:', error);
      throw new Error(`Failed to fetch publications: ${error.response?.data?.message || error.message}`);
    }
  }

  async getAllPosts() {
    try {
      const user = await this.getCurrentUser();
      const posts = await this.getUserPosts(user.data.id);
      return posts;
    } catch (error) {
      console.error('Error fetching all posts:', error);
      throw new Error(`Failed to fetch all posts: ${error.message}`);
    }
  }

  isConfigured() {
    return !!this.accessToken;
  }

  getConfigurationHelp() {
    return {
      message: "Medium API token not configured",
      instructions: [
        "1. Create a .env file in your project root",
        "2. Add your Medium access token: VITE_MEDIUM_ACCESS_TOKEN=your_token_here",
        "3. Note: Medium no longer issues new API tokens as of 2024",
        "4. If you have an existing token, add it to the .env file"
      ]
    };
  }
}

export default new MediumApiService();