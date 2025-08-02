export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type StatusCodeString<T extends number> = T | `${T}`;

export type SuccessStatusCode = 200 | 201 | 202 | 203 | 204 | 206 | 207 | 208;

export type ClientErrorStatusCode =
  | 400
  | 401
  | 403
  | 404
  | 405
  | 406
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 422
  | 423
  | 424
  | 425
  | 426
  | 428
  | 429;
export type ServerErrorStatusCode =
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 508
  | 510
  | 511;

export type ErrorStatusCode = ClientErrorStatusCode | ServerErrorStatusCode;
export type AllStatusCodes =
  | SuccessStatusCode
  | ClientErrorStatusCode
  | ServerErrorStatusCode;

// Create string versions for all status codes
export type SuccessStatusCodeString =
  | StatusCodeString<200>
  | StatusCodeString<201>
  | StatusCodeString<202>
  | StatusCodeString<203>
  | StatusCodeString<204>
  | StatusCodeString<206>
  | StatusCodeString<207>
  | StatusCodeString<208>;
export type ClientErrorStatusCodeString =
  | StatusCodeString<400>
  | StatusCodeString<401>
  | StatusCodeString<403>
  | StatusCodeString<404>
  | StatusCodeString<405>
  | StatusCodeString<406>
  | StatusCodeString<408>
  | StatusCodeString<409>
  | StatusCodeString<410>
  | StatusCodeString<411>
  | StatusCodeString<412>
  | StatusCodeString<413>
  | StatusCodeString<414>
  | StatusCodeString<415>
  | StatusCodeString<416>
  | StatusCodeString<417>
  | StatusCodeString<422>
  | StatusCodeString<423>
  | StatusCodeString<424>
  | StatusCodeString<425>
  | StatusCodeString<426>
  | StatusCodeString<428>
  | StatusCodeString<429>;
export type ServerErrorStatusCodeString =
  | StatusCodeString<500>
  | StatusCodeString<501>
  | StatusCodeString<502>
  | StatusCodeString<503>
  | StatusCodeString<504>
  | StatusCodeString<505>
  | StatusCodeString<506>
  | StatusCodeString<507>
  | StatusCodeString<508>
  | StatusCodeString<510>
  | StatusCodeString<511>;

export type ErrorStatusCodeString =
  | ClientErrorStatusCodeString
  | ServerErrorStatusCodeString;
export type AllStatusCodeString =
  | SuccessStatusCodeString
  | ClientErrorStatusCodeString
  | ServerErrorStatusCodeString;

// Create a type that includes both numeric and string representations
export type HttpStatusCode = AllStatusCodes | AllStatusCodeString;
