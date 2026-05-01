export type Lang       = 'curl' | 'js' | 'python';
export type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';

export interface EndpointParam {
  name:        string;
  type:        string;
  required:    boolean;
  description: string;
}

export interface EndpointExamples {
  curl:   string;
  js:     string;
  python: string;
}

export interface Endpoint {
  method:      HttpMethod;
  path:        string;
  title:       string;
  description: string;
  params?:     EndpointParam[];
  /** JSON-encoded response body (formatted with 2-space indent). */
  response:    string;
  examples:    EndpointExamples;
}

export interface SidebarSection {
  label: string;
  links: { href: string; label: string }[];
}
