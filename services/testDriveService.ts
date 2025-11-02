import api from '@/lib/api';

export interface TestDrive {
  _id: string;
  customer: string | {
    _id: string;
    fullName: string;
    phone: string;
  };
  dealer: string | {
    _id: string;
    name: string;
  };
  variant: string | {
    _id: string;
    trim: string;
  };
  preferredTime: string;
  status: 'requested' | 'confirmed' | 'done' | 'cancelled';
  result?: {
    feedback?: string;
    interestRate?: number;
  };
  assignedStaff?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestDriveRequest {
  customer: string;
  variant: string;
  preferredTime: string;
  dealer?: string;
  assignedStaff?: string;
}

export interface UpdateTestDriveRequest {
  status?: 'requested' | 'confirmed' | 'done' | 'cancelled';
  result?: {
    feedback?: string;
    interestRate?: number;
  };
}

export const testDriveService = {
  getTestDrives: async (): Promise<TestDrive[]> => {
    const response = await api.get('/test-drives');
    return Array.isArray(response.data) ? response.data : [];
  },

  getTestDriveById: async (id: string): Promise<TestDrive> => {
    const response = await api.get(`/test-drives/${id}`);
    return response.data;
  },

  createTestDrive: async (data: CreateTestDriveRequest): Promise<TestDrive> => {
    const response = await api.post('/test-drives', data);
    return response.data;
  },

  updateTestDrive: async (id: string, data: UpdateTestDriveRequest): Promise<TestDrive> => {
    const response = await api.patch(`/test-drives/${id}`, data);
    return response.data;
  },

  approveTestDrive: async (id: string): Promise<TestDrive> => {
    const response = await api.patch(`/test-drives/${id}`, { status: 'confirmed' });
    return response.data;
  },

  rejectTestDrive: async (id: string): Promise<TestDrive> => {
    const response = await api.patch(`/test-drives/${id}`, { status: 'cancelled' });
    return response.data;
  },

  completeTestDrive: async (id: string, feedback: string, interestRate?: number): Promise<TestDrive> => {
    const response = await api.patch(`/test-drives/${id}`, {
      status: 'done',
      result: {
        feedback,
        interestRate,
      },
    });
    return response.data;
  },
};

