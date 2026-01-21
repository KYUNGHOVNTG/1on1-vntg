export interface CodeMaster {
    code_type: string;
    code_type_name: string;
    code_len: number;
    rmk?: string;
    in_user?: string;
    in_date: string;
    up_user?: string;
    up_date?: string;
}

export interface CodeMasterCreateRequest {
    code_type: string;
    code_type_name: string;
    rmk?: string;
}

export interface CodeMasterUpdateRequest {
    code_type_name?: string;
    rmk?: string;
}

export interface CodeDetail {
    code_type: string;
    code: string;
    code_name: string;
    use_yn: string;
    sort_seq?: number;
    rmk?: string;
    in_user?: string;
    in_date: string;
    up_user?: string;
    up_date?: string;
}

export interface CodeDetailCreateRequest {
    code_type: string;
    code: string;
    code_name: string;
    use_yn: string;
    sort_seq?: number;
    rmk?: string;
}

export interface CodeDetailUpdateRequest {
    code_name?: string;
    use_yn?: string;
    sort_seq?: number;
    rmk?: string;
}
