import { apiClient } from '@/core/api/client';
import type { ApiResponse } from '@/core/api/types';
import type { CodeMaster, CodeDetail } from './types';

export async function fetchCodeMasters(): Promise<CodeMaster[]> {
    const response = await apiClient.get<ApiResponse<CodeMaster[]>>('/v1/codes/masters');
    return response.data.data || [];
}

export async function fetchCodeDetails(codeType: string): Promise<CodeDetail[]> {
    const response = await apiClient.get<ApiResponse<CodeDetail[]>>(`/v1/codes/masters/${codeType}/details`);
    return response.data.data || [];
}
