export interface AuthorResponse {
  id: number;
  name: string;
}

export interface AuthorListResponse {
  items: AuthorResponse[];
}
