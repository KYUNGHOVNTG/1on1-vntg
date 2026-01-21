import { apiClient } from '@/core/api/client';
import type { ApiResponse } from '@/core/api/types';
import type { CodeMaster, CodeDetail, CodeMasterCreateRequest, CodeMasterUpdateRequest } from './types';

export async function fetchCodeMasters(): Promise<CodeMaster[]> {
    const response = await apiClient.get<ApiResponse<CodeMaster[]>>('/v1/codes/masters');
    return response.data.data || [];
}

export async function fetchCodeDetails(codeType: string): Promise<CodeDetail[]> {
    const response = await apiClient.get<ApiResponse<CodeDetail[]>>(`/v1/codes/masters/${codeType}/details`);
    return response.data.data || [];
}

export async function createCodeMaster(data: CodeMasterCreateRequest): Promise<CodeMaster> {
    const response = await apiClient.post<ApiResponse<CodeMaster>>('/v1/codes/masters', data);
    return response.data.data;
}

export async function updateCodeMaster(codeType: string, data: CodeMasterUpdateRequest): Promise<CodeMaster> {
    const response = await apiClient.put<ApiResponse<CodeMaster>>(`/v1/codes/masters/${codeType}`, data);
    return response.data.data;
}

export async function deleteCodeMaster(codeType: string): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/v1/codes/masters/${codeType}`);
    return response.data.data;
}
