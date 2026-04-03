import { mockMemberCard, mockMembers, mockPointSummary, mockTransactions } from '../mockData';
import { useMock } from '../firebase';

export async function getResidentDashboard() {
  if (useMock) {
    return {
      card: mockMemberCard,
      summary: mockPointSummary,
      transactions: mockTransactions
    };
  }

  throw new Error('Connect Firestore queries in src/lib/services/memberService.ts');
}

export async function getMembers() {
  if (useMock) {
    return mockMembers;
  }

  throw new Error('Connect members collection in Firestore.');
}
