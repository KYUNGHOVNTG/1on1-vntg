import { apiClient } from '@/core/api/client';
import type { ApiResponse } from '@/core/api/types';
import type {
    CodeMaster,
    CodeDetail,
    CodeMasterCreateRequest,
    CodeMasterUpdateRequest,
    CodeDetailCreateRequest,
    CodeDetailUpdateRequest
} from './types';

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

export async function createCodeDetail(codeType: string, data: CodeDetailCreateRequest): Promise<CodeDetail> {
    const response = await apiClient.post<ApiResponse<CodeDetail>>(`/v1/codes/masters/${codeType}/details`, data);
    return response.data.data;
}

export async function updateCodeDetail(codeType: string, code: string, data: CodeDetailUpdateRequest): Promise<CodeDetail> {
    const response = await apiClient.put<ApiResponse<CodeDetail>>(`/v1/codes/masters/${codeType}/details/${code}`, data);
    return response.data.data;
}

export async function deleteCodeDetail(codeType: string, code: string): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/v1/codes/masters/${codeType}/details/${code}`);
    return response.data.data;
}
