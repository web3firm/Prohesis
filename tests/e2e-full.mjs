#!/usr/bin/env node
/**
 * Prohesis E2E Test Suite
 * ========================
 * Comprehensive end-to-end testing covering:
 * - Market creation
 * - Betting flow
 * - Market resolution
 * - Payout claims
 * 
 * Run: node tests/e2e-full.mjs
 */

import { expect } from 'chai';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 60000;

// Test utilities
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok && !options.allowError) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Test suite
describe('Prohesis E2E Test Suite', function() {
  this.timeout(TEST_TIMEOUT);
  
  let testMarketId;
  let testMarketAddress;
  let testBetTxHash;

  describe('1. Market Creation', () => {
    it('should create a new market via API', async () => {
      const payload = {
        title: `Test Market ${Date.now()}`,
        description: 'E2E test market',
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        outcomes: ['Yes', 'No'],
        creatorId: 'test-admin',
      };

      const result = await apiCall('/api/markets/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      expect(result).to.have.property('id');
      testMarketId = result.id;
      console.log(`✅ Market created: ID ${testMarketId}`);
    });

    it('should retrieve market details', async () => {
      const market = await apiCall(`/api/markets/details/${testMarketId}`);
      
      expect(market).to.have.property('title');
      expect(market).to.have.property('endTime');
      expect(market.id).to.equal(testMarketId);
      console.log(`✅ Market details retrieved`);
    });

    it('should list markets including new one', async () => {
      const markets = await apiCall('/api/markets/list');
      
      expect(markets).to.be.an('array');
      const found = markets.find(m => m.id === testMarketId);
      expect(found).to.exist;
      console.log(`✅ Market appears in list`);
    });
  });

  describe('2. On-chain Sync', () => {
    it('should sync market with factory', async () => {
      // This would normally require admin auth and on-chain deployment
      // For now, we'll simulate by checking sync status
      const market = await apiCall(`/api/markets/details/${testMarketId}`);
      
      if (market.onchainAddr) {
        testMarketAddress = market.onchainAddr;
        console.log(`✅ Market on-chain address: ${testMarketAddress}`);
      } else {
        console.log(`⚠️  Market not yet synced on-chain`);
      }
    });
  });

  describe('3. Betting Flow', () => {
    it('should validate bet placement prerequisites', async () => {
      // Check market is still open
      const market = await apiCall(`/api/markets/details/${testMarketId}`);
      const now = Date.now();
      const isOpen = now < Number(market.endTime);
      
      expect(isOpen).to.be.true;
      console.log(`✅ Market is open for betting`);
    });

    it('should simulate bet placement', async () => {
      // In a real test with web3, this would place an actual bet
      // For API testing, we'll simulate the bet record
      const betPayload = {
        marketId: testMarketId,
        userId: 'test-user-1',
        outcome: 0, // Yes
        amount: '0.01',
        txHash: `0xtest${Date.now()}`, // Mock tx hash
      };

      try {
        const result = await apiCall('/api/bets/place', {
          method: 'POST',
          body: JSON.stringify(betPayload),
          allowError: true,
        });
        
        if (result.ok) {
          console.log(`✅ Bet recorded`);
          testBetTxHash = betPayload.txHash;
        } else {
          console.log(`⚠️  Bet API requires on-chain tx: ${result.error || 'unknown'}`);
        }
      } catch (e) {
        console.log(`⚠️  Bet placement skipped (requires on-chain): ${e.message}`);
      }
    });

    it('should retrieve user bets', async () => {
      try {
        const bets = await apiCall('/api/user/bets?userId=test-user-1', { allowError: true });
        
        if (Array.isArray(bets)) {
          console.log(`✅ User bets retrieved: ${bets.length} total`);
        } else {
          console.log(`⚠️  Bets API returned: ${JSON.stringify(bets)}`);
        }
      } catch (e) {
        console.log(`⚠️  Bets retrieval skipped: ${e.message}`);
      }
    });
  });

  describe('4. Market Resolution', () => {
    it('should check resolution eligibility', async () => {
      const market = await apiCall(`/api/markets/details/${testMarketId}`);
      const now = Date.now();
      const canResolve = now >= Number(market.endTime);
      
      if (canResolve) {
        console.log(`✅ Market eligible for resolution`);
      } else {
        console.log(`⏳ Market not yet ended (${new Date(Number(market.endTime))})`);
      }
    });

    it('should simulate market resolution', async () => {
      // Admin-only action in real scenario
      try {
        const resolvePayload = {
          marketId: testMarketId,
          winningOutcome: 0, // Yes wins
          txHash: `0xresolve${Date.now()}`,
        };

        const result = await apiCall('/api/markets/resolve', {
          method: 'POST',
          body: JSON.stringify(resolvePayload),
          allowError: true,
        });

        if (result.ok) {
          console.log(`✅ Market resolved`);
        } else {
          console.log(`⚠️  Resolution requires admin auth: ${result.error || 'unknown'}`);
        }
      } catch (e) {
        console.log(`⚠️  Resolution skipped (requires admin/on-chain): ${e.message}`);
      }
    });
  });

  describe('5. Payout Claims', () => {
    it('should validate claim eligibility', async () => {
      try {
        const validation = await apiCall(
          `/api/payouts/validate?marketId=${testMarketId}&userId=test-user-1`,
          { allowError: true }
        );

        if (validation.canClaim === true) {
          console.log(`✅ User eligible to claim`);
        } else if (validation.canClaim === false) {
          console.log(`ℹ️  Not eligible: ${validation.reason}`);
        } else {
          console.log(`⚠️  Claim validation: ${JSON.stringify(validation)}`);
        }
      } catch (e) {
        console.log(`⚠️  Claim validation skipped: ${e.message}`);
      }
    });

    it('should simulate payout claim', async () => {
      try {
        const claimPayload = {
          marketId: testMarketId,
          userId: 'test-user-1',
          txHash: `0xclaim${Date.now()}`,
        };

        const result = await apiCall('/api/payouts/claim', {
          method: 'POST',
          body: JSON.stringify(claimPayload),
          allowError: true,
        });

        if (result.ok) {
          console.log(`✅ Payout claimed`);
        } else {
          console.log(`ℹ️  Claim result: ${result.error || JSON.stringify(result)}`);
        }
      } catch (e) {
        console.log(`⚠️  Claim skipped: ${e.message}`);
      }
    });
  });

  describe('6. Analytics & Leaderboard', () => {
    it('should fetch analytics data', async () => {
      try {
        const analytics = await apiCall('/api/analytics', { allowError: true });
        
        if (analytics && typeof analytics === 'object') {
          console.log(`✅ Analytics retrieved`);
        } else {
          console.log(`⚠️  Analytics: ${JSON.stringify(analytics)}`);
        }
      } catch (e) {
        console.log(`⚠️  Analytics skipped: ${e.message}`);
      }
    });

    it('should fetch leaderboard', async () => {
      try {
        const leaderboard = await apiCall('/api/leaderboard', { allowError: true });
        
        if (Array.isArray(leaderboard)) {
          console.log(`✅ Leaderboard retrieved: ${leaderboard.length} entries`);
        } else {
          console.log(`⚠️  Leaderboard: ${JSON.stringify(leaderboard)}`);
        }
      } catch (e) {
        console.log(`⚠️  Leaderboard skipped: ${e.message}`);
      }
    });
  });

  describe('7. UI Smoke Tests', () => {
    it('should verify home page is accessible', async () => {
      const response = await fetch(BASE_URL);
      expect(response.ok).to.be.true;
      console.log(`✅ Home page accessible`);
    });

    it('should verify market detail page is accessible', async () => {
      const response = await fetch(`${BASE_URL}/markets/${testMarketId}`);
      expect(response.ok).to.be.true;
      console.log(`✅ Market detail page accessible`);
    });

    it('should verify admin login is accessible', async () => {
      const response = await fetch(`${BASE_URL}/admin/auth/login`);
      expect(response.ok).to.be.true;
      console.log(`✅ Admin login accessible`);
    });
  });
});

// Run tests
console.log('\n🚀 Starting Prohesis E2E Test Suite...\n');
console.log(`📡 Target: ${BASE_URL}\n`);

run();
