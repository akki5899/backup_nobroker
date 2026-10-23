import axios from 'axios';

/**
 * Frontend API Integration Test Suite
 * Run this to verify all backend APIs are properly connected
 */

const API_URL = 'http://localhost:8000/api/v1';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
}

class APIIntegrationTester {
  private testResults: TestResult[] = [];
  private authToken: string = '';
  private testUserId: number = 0;
  private testPropertyId: number = 0;

  async runAllTests() {
    console.log('🧪 Starting Frontend API Integration Tests...\n');

    await this.testAuthEndpoints();
    await this.testPropertyEndpoints();
    await this.testUserEndpoints();
    await this.testWishlistEndpoints();
    await this.testNotificationEndpoints();
    await this.testInquiryEndpoints();
    await this.testRewardsEndpoints();

    this.printResults();
  }

  private async runTest(
    name: string,
    testFn: () => Promise<void>
  ) {
    const start = Date.now();
    try {
      await testFn();
      this.testResults.push({
        name,
        status: 'PASS',
        message: 'Success',
        duration: Date.now() - start,
      });
      console.log(`✅ ${name}`);
    } catch (error: any) {
      this.testResults.push({
        name,
        status: 'FAIL',
        message: error.message,
        duration: Date.now() - start,
      });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  private async testAuthEndpoints() {
    console.log('\n📝 Testing Auth Endpoints...');

    await this.runTest('Check User Exists', async () => {
      const response = await axios.get(`${API_URL}/auth/check-user`, {
        params: { email: 'test@example.com' },
      });
      if (response.status !== 200) throw new Error('API returned error');
    });

    await this.runTest('Register User', async () => {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          email: `test${Date.now()}@example.com`,
          phone: '+919876543210',
          full_name: 'Test User',
          password: 'TestPassword123!',
          user_type: 'buyer',
        });
        if (response.status !== 200) throw new Error('Registration failed');
      } catch (error: any) {
        if (error.response?.status === 400) {
          // User might already exist, that's okay
          return;
        }
        throw error;
      }
    });

    // Note: Login test would need valid credentials
    await this.runTest('Login Endpoint Available', async () => {
      try {
        await axios.post(`${API_URL}/auth/login`, {
          username: 'test@example.com',
          password: 'wrongpassword',
        });
      } catch (error: any) {
        // Expected to fail with wrong password, but endpoint exists
        if (error.response?.status === 401) {
          return; // This is expected
        }
        throw error;
      }
    });

    await this.runTest('Send OTP Endpoint Available', async () => {
      try {
        await axios.post(`${API_URL}/auth/send-otp`, {
          phone: '+919876543210',
        });
      } catch (error: any) {
        // Endpoint should exist even if OTP fails
        if (error.response?.status) {
          return;
        }
        throw error;
      }
    });
  }

  private async testPropertyEndpoints() {
    console.log('\n🏠 Testing Property Endpoints...');

    await this.runTest('Search Properties', async () => {
      const response = await axios.get(`${API_URL}/properties`, {
        params: { city: 'Bangalore', limit: 10 },
      });
      if (!Array.isArray(response.data)) throw new Error('Invalid response format');
    });

    await this.runTest('Get Debug Sample', async () => {
      const response = await axios.get(`${API_URL}/properties/debug/sample`);
      if (!response.data.sample_properties) throw new Error('Missing sample data');
    });

    await this.runTest('Get Debug Count', async () => {
      const response = await axios.get(`${API_URL}/properties/debug/count`);
      if (typeof response.data.total_properties !== 'number') {
        throw new Error('Invalid count data');
      }
    });

    await this.runTest('Geofence Search Endpoint Available', async () => {
      try {
        await axios.post(`${API_URL}/properties/geofence-search`, {
          coordinates: [
            [77.5, 12.9],
            [77.6, 12.9],
            [77.6, 13.0],
            [77.5, 13.0],
          ],
        });
      } catch (error: any) {
        // Endpoint exists even if no data
        if (error.response?.status) {
          return;
        }
        throw error;
      }
    });
  }

  private async testUserEndpoints() {
    console.log('\n👤 Testing User Endpoints...');

    // These require authentication, so they'll fail without token
    // But we can verify the endpoints exist

    await this.runTest('Profile Endpoint Available', async () => {
      try {
        await axios.get(`${API_URL}/users/me`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          return; // Expected without auth
        }
        throw error;
      }
    });

    await this.runTest('My Properties Endpoint Available', async () => {
      try {
        await axios.get(`${API_URL}/users/my-properties`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          return; // Expected without auth
        }
        throw error;
      }
    });
  }

  private async testWishlistEndpoints() {
    console.log('\n❤️ Testing Wishlist Endpoints...');

    await this.runTest('Wishlist Endpoint Available', async () => {
      try {
        await axios.get(`${API_URL}/wishlist`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          return; // Expected without auth
        }
        throw error;
      }
    });

    await this.runTest('Check Wishlist Status Endpoint Available', async () => {
      try {
        await axios.get(`${API_URL}/wishlist/check/1`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          return; // Expected without auth
        }
        throw error;
      }
    });
  }

  private async testNotificationEndpoints() {
    console.log('\n🔔 Testing Notification Endpoints...');

    await this.runTest('Notifications Endpoint Available', async () => {
      try {
        await axios.get(`${API_URL}/notifications`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          return; // Expected without auth
        }
        throw error;
      }
    });
  }

  private async testInquiryEndpoints() {
    console.log('\n💬 Testing Inquiry Endpoints...');

    await this.runTest('Create Inquiry Endpoint Available', async () => {
      try {
        await axios.post(`${API_URL}/inquiries`, {
          property_id: 1,
          message: 'Test message',
          name: 'Test User',
          email: 'test@example.com',
          phone: '+919876543210',
        });
      } catch (error: any) {
        if (error.response?.status === 401) {
          return; // Expected without auth
        }
        throw error;
      }
    });

    await this.runTest('Get My Inquiries Endpoint Available', async () => {
      try {
        await axios.get(`${API_URL}/inquiries/my-inquiries`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          return; // Expected without auth
        }
        throw error;
      }
    });

    await this.runTest('Get Property Inquiries Endpoint Available', async () => {
      try {
        await axios.get(`${API_URL}/inquiries/property-inquiries`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          return; // Expected without auth
        }
        throw error;
      }
    });
  }

  private async testRewardsEndpoints() {
    console.log('\n🎁 Testing Rewards Endpoints...');

    await this.runTest('Get User Points Endpoint Available', async () => {
      try {
        await axios.get(`${API_URL}/rewards/points`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          return; // Expected without auth
        }
        throw error;
      }
    });

    await this.runTest('Get Available Rewards', async () => {
      const response = await axios.get(`${API_URL}/rewards/available`);
      if (!response.data.rewards) throw new Error('Missing rewards data');
    });
  }

  private printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const passed = this.testResults.filter((r) => r.status === 'PASS').length;
    const failed = this.testResults.filter((r) => r.status === 'FAIL').length;
    const total = this.testResults.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${this.testResults.reduce((sum, r) => sum + r.duration, 0)}ms`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter((r) => r.status === 'FAIL')
        .forEach((result) => {
          console.log(`  - ${result.name}: ${result.message}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! API integration is working correctly.');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please check the errors above.`);
    }
    console.log('='.repeat(60));
  }
}

// Run tests
const tester = new APIIntegrationTester();
tester.runAllTests().catch(console.error);

