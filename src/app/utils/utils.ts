import { HttpErrorResponse } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { FormGroup } from '@angular/forms';

const NETWORK_ERR_MSG = 'Failed! Check your internet connection.';

export function getResErrMsg(res: unknown): string | null {
  if (res instanceof HttpErrorResponse) {
    if (res.error) {
      if (res.error instanceof ProgressEvent && res.status === 0) {
        return NETWORK_ERR_MSG;
      }
      const detail = res.error['detail'] as unknown;
      if (typeof detail === 'string') {
        return detail;
      }
      const nonFieldErrors = res.error['non_field_errors'] as unknown[] | undefined;
      if (nonFieldErrors && typeof nonFieldErrors[0] === 'string') {
        return nonFieldErrors[0];
      }
    }
    if (res.status === 403) return 'Forbidden.';
  }
  return null;
}

export function handleFormGroupSubmissionError(form: FormGroup, response: unknown) {
  const result: { nonFieldError: null | string } = { nonFieldError: getResErrMsg(response) };
  if (response instanceof HttpErrorResponse && response.status === 400) {
    const nonFieldErrors = response.error['non_field_errors'] as string[] | undefined;
    if (nonFieldErrors && typeof nonFieldErrors[0] === 'string') {
      result.nonFieldError = nonFieldErrors[0];
    }
    const controlNames = Object.keys(form.controls);
    for (const controlName of controlNames) {
      const fieldError = response.error[controlName] as string | undefined;
      if (fieldError) {
        const fieldControl = form.get(controlName);
        if (fieldControl) {
          if (typeof fieldError === 'string') {
            fieldControl.setErrors({ validation: fieldError });
          } else if (Array.isArray(fieldError) && typeof fieldError[0] === 'string') {
            fieldControl.setErrors({ validation: fieldError[0] });
          }
        }
      }
    }
  }
  if (form.valid && !result.nonFieldError) {
    result.nonFieldError = 'Something went wrong, please try again later.';
  }
  return result;
}

export function createResErrorHandler(
  messageSignal: { set: (value: string) => void },
  defaultMessage: string,
) {
  return (res: unknown) => messageSignal.set(getResErrMsg(res) || defaultMessage);
}

export function updateRouteTitle(service: Title, title: string) {
  if (title) {
    const suffix = service.getTitle().split('|').slice(1).join('|');
    service.setTitle(title + (suffix ? ' |' + suffix : ''));
  }
}

export function mergeTailwindCNs(aCN: string | string[], bCN: string | string[]) {
  const aCNs = typeof aCN === 'string' ? aCN.split(' ') : aCN;
  const bCNs = typeof bCN === 'string' ? bCN.split(' ') : bCN;
  return aCNs
    .filter((a) => !bCNs.some((b) => a.split('-')[0] === b.split('-')[0]))
    .concat(bCNs)
    .join(' ');
}

export function sortByDate<T>(
  items: readonly T[],
  dateSelector: (item: T) => Date | string,
  order: 'asc' | 'desc' = 'desc',
): T[] {
  return [...items].sort(
    (a, b) =>
      (new Date(dateSelector(a)).getTime() - new Date(dateSelector(b)).getTime()) *
      (order === 'desc' ? -1 : 1),
  );
}

export function mergeDistinctBy<T, K>(
  base: readonly T[],
  next: readonly T[],
  keySelector: (value: T) => K,
): T[] {
  const result: T[] = [];
  const seen = new Set<K>();
  const appendDistinct = (value: T) => {
    const key = keySelector(value);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  };
  base.forEach(appendDistinct);
  next.forEach(appendDistinct);
  return result;
}
