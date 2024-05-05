export interface PaginationResponse<T> {
    total_pages: number;
    total_elements: number;
    contents: T;
}

export interface BasePaginationSettings {
    page: number;
    size: number;
}
