import { apiClient } from '@/core/api/client';
import type { CodeMaster, CodeDetail } from './types';

export async function fetchCodeMasters(): Promise<CodeMaster[]> {
    const response = await apiClient.get<CodeMaster[]>('/v1/codes/masters');
    return response.data;
}

export async function fetchCodeDetails(codeType: string): Promise<CodeDetail[]> {
    const response = await apiClient.get<CodeDetail[]>(`/v1/codes/masters/${codeType}/details`);
    return response.data;
}
