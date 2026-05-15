import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import * as Utils from './utils';
import { FormControl, FormGroup } from '@angular/forms';

const errorMessage = signal('');
const defaultMessage = 'Test default error message';

describe('App Utils', () => {
  describe(Utils.mergeTailwindCNs.name, () => {
    it('should not include a class from the 1st that exists in the 2nd', () => {
      const firstCN = 'foo bar tar-baz';
      const secondCN = 'wax-jar bar baz';
      const expectedCN = 'foo tar-baz wax-jar bar baz';
      expect(Utils.mergeTailwindCNs(firstCN, secondCN)).toBe(expectedCN);
      expect(Utils.mergeTailwindCNs(firstCN.split(' '), secondCN)).toBe(expectedCN);
      expect(Utils.mergeTailwindCNs(firstCN, secondCN.split(' '))).toBe(expectedCN);
      expect(Utils.mergeTailwindCNs(firstCN.split(' '), secondCN.split(' '))).toBe(expectedCN);
    });

    it('should not include a class from the 1st if one with same hyphen-prefix exists in the 2nd', () => {
      const firstCN = 'foo-bar baz-tar';
      const secondCN = 'wax bar-tar baz-tar';
      const expectedCN = 'foo-bar wax bar-tar baz-tar';
      expect(Utils.mergeTailwindCNs(firstCN, secondCN)).toBe(expectedCN);
      expect(Utils.mergeTailwindCNs(firstCN.split(' '), secondCN)).toBe(expectedCN);
      expect(Utils.mergeTailwindCNs(firstCN, secondCN.split(' '))).toBe(expectedCN);
      expect(Utils.mergeTailwindCNs(firstCN.split(' '), secondCN.split(' '))).toBe(expectedCN);
    });
  });

  describe(Utils.getResErrMsg.name, () => {
    it('should return null', () => {
      const message = 7;
      const responses = [
        null,
        true,
        'foo',
        undefined,
        { foo: 'bar' },
        new HttpErrorResponse({ status: 500 }),
        new HttpErrorResponse({ status: 400, error: { detail: message } }),
        new HttpErrorResponse({ status: 400, error: { non_field_errors: [message] } }),
      ];
      for (const res of responses) {
        expect(Utils.getResErrMsg(res)).toBeNull();
      }
    });

    it('should return an error message', () => {
      const message = 'Test error!';
      const responses = [
        new HttpErrorResponse({ status: 400, error: { detail: message } }),
        new HttpErrorResponse({ status: 400, error: { non_field_errors: [message] } }),
      ];
      for (const res of responses) {
        expect(Utils.getResErrMsg(res)).toBe(message);
      }
      expect(Utils.getResErrMsg(new HttpErrorResponse({ status: 403 }))).toMatch(/forbidden/i);
    });
  });

  describe(Utils.handleFormGroupSubmissionError.name, () => {
    it('should set field validation error and return the first non-field error', () => {
      const non_field_errors = ['test non-field error #1', 'test non-field error #1'];
      const error = {
        non_field_errors,
        field1: 'test field error #1',
        field2: 'test field error #2',
      };
      const formGroup = new FormGroup({ field2: new FormControl(''), field3: new FormControl('') });
      const response = new HttpErrorResponse({ status: 400, error });
      const result = Utils.handleFormGroupSubmissionError(formGroup, response);
      expect(formGroup.valid).toBe(false);
      expect(formGroup.invalid).toBe(true);
      expect(formGroup.controls.field2.errors).toStrictEqual({ validation: error.field2 });
      expect(formGroup.controls.field3.errors).toBeNull();
      expect(result.nonFieldError).toBe(non_field_errors[0]);
    });

    it('should return the error detail as non-field error and leave the form clean', () => {
      const error = { detail: 'test error detail' };
      const formGroup = new FormGroup({ field: new FormControl('') });
      const response = new HttpErrorResponse({ status: 400, error });
      const result = Utils.handleFormGroupSubmissionError(formGroup, response);
      expect(formGroup.valid).toBe(true);
      expect(formGroup.invalid).toBe(false);
      expect(formGroup.errors).toBeNull();
      expect(formGroup.controls.field.errors).toBeNull();
      expect(result.nonFieldError).toBe(error.detail);
    });
  });

  describe(Utils.createResErrorHandler.name, () => {
    it('should use the given error message on an arbitrary error', () => {
      const error = new Error('Test arbitrary error');
      Utils.createResErrorHandler(errorMessage, defaultMessage)(error);
      expect(errorMessage()).toBe(defaultMessage);
    });

    it('should use the given error message on a backend error', () => {
      const error = new HttpErrorResponse({ status: 500, statusText: 'Internal server error' });
      Utils.createResErrorHandler(errorMessage, defaultMessage)(error);
      expect(errorMessage()).toBe(defaultMessage);
    });

    it('should use the network error message on a network error', () => {
      const error = new HttpErrorResponse({
        error: new ProgressEvent('Network error'),
        statusText: 'Failed',
        status: 0,
      });
      Utils.createResErrorHandler(errorMessage, defaultMessage)(error);
      expect(errorMessage()).toMatch(/check .* (internet)? connection/i);
    });
  });

  describe(Utils.sortByDate.name, () => {
    it('should sort items by their dates (in descending order)', () => {
      const first = { date: new Date(Date.now() - 1) };
      const second = { date: new Date(Date.now() - 2) };
      const third = { date: new Date(Date.now() - 3) };
      const items = [third, first, second];
      const expectedItems = [first, second, third];
      expect(Utils.sortByDate(items, (x) => x.date)).toStrictEqual(expectedItems);
    });

    it('should sort items by their dates (in ascending order)', () => {
      const first = { date: new Date(Date.now() - 1) };
      const second = { date: new Date(Date.now() - 2) };
      const third = { date: new Date(Date.now() - 3) };
      const items = [third, first, second];
      const expectedItems = [third, second, first];
      expect(Utils.sortByDate(items, (x) => x.date, 'asc')).toStrictEqual(expectedItems);
    });
  });

  describe(Utils.mergeDistinctBy.name, () => {
    it('should return new array has all items from first and second arrays without duplications, and in same order', () => {
      const base = [{ key: 1 }, { key: 2 }, { key: 1 }, { key: 3 }, { key: 2 }];
      const next = [{ key: 2 }, { key: 4 }, { key: 3 }, { key: 1 }, { key: 5 }, { key: 1 }];
      const expected = [{ key: 1 }, { key: 2 }, { key: 3 }, { key: 4 }, { key: 5 }];
      const actual = Utils.mergeDistinctBy(base, next, (x) => x.key);
      expect(actual).not.toBe(base);
      expect(actual).not.toBe(next);
      expect(actual).toStrictEqual(expected);
    });

    it('should return new array has all items from first in order, and without duplications, if second one is empty', () => {
      const base = [{ key: 1 }, { key: 2 }, { key: 1 }, { key: 3 }, { key: 2 }];
      const next: { key: number }[] = [];
      const expected = [{ key: 1 }, { key: 2 }, { key: 3 }];
      const actual = Utils.mergeDistinctBy(base, next, (x) => x.key);
      expect(actual).not.toBe(base);
      expect(actual).not.toBe(next);
      expect(actual).toStrictEqual(expected);
    });

    it('should return new array has all items from second in order, and without duplications, if first one is empty', () => {
      const base: { key: number }[] = [];
      const next = [{ key: 1 }, { key: 2 }, { key: 1 }, { key: 3 }, { key: 2 }];
      const expected = [{ key: 1 }, { key: 2 }, { key: 3 }];
      const actual = Utils.mergeDistinctBy(base, next, (x) => x.key);
      expect(actual).not.toBe(base);
      expect(actual).not.toBe(next);
      expect(actual).toStrictEqual(expected);
    });

    it('should return new empty array, if first and second arguments are empty arrays', () => {
      const base: { key: number }[] = [];
      const next: { key: number }[] = [];
      const expected: { key: number }[] = [];
      const actual = Utils.mergeDistinctBy(base, next, (x) => x.key);
      expect(actual).not.toBe(base);
      expect(actual).not.toBe(next);
      expect(actual).toStrictEqual(expected);
    });
  });
});
