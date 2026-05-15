import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { FormField } from './form-field';
import { FormControl } from '@angular/forms';

const fieldData = {
  control: new FormControl(''),
  type: 'text' as const,
  label: 'Test Field',
  inputId: 'test-id',
};

const renderComponent = ({ inputs, ...options }: RenderComponentOptions<FormField> = {}) => {
  return render(FormField, {
    inputs: { ...fieldData, ...(inputs || {}) },
    ...options,
  });
};

describe('FormField', () => {
  it('should has the given data', async () => {
    await renderComponent({ inputs: fieldData });
    expect(screen.getByRole('textbox', { name: fieldData.label })).toBeVisible();
  });

  it('should be invalid and has a required-error', async () => {
    const control = new FormControl('');
    const { rerender } = await renderComponent({ inputs: { ...fieldData, control } });
    const errors = { required: true };
    control.markAsDirty();
    control.setErrors(errors);
    await rerender({ partialUpdate: true });
    expect(screen.getByRole('textbox', { name: fieldData.label })).toBeInvalid();
    expect(screen.getByText(/required/i)).toBeVisible();
  });

  it('should be invalid and has a validation-error', async () => {
    const control = new FormControl('');
    const { rerender } = await renderComponent({ inputs: { ...fieldData, control } });
    const errors = { validation: 'Test validation error!' };
    control.markAsDirty();
    control.setErrors(errors);
    await rerender({ partialUpdate: true });
    expect(screen.getByRole('textbox', { name: fieldData.label })).toBeInvalid();
    expect(screen.getByText(new RegExp(errors.validation))).toBeVisible();
  });

  it('should be invalid and has any error from an arbitrary errors', async () => {
    const control = new FormControl('');
    const { rerender } = await renderComponent({ inputs: { ...fieldData, control } });
    const errors = { foo: 'Test arbitrary error #1!', bar: 'Test arbitrary error #1!' };
    control.markAsDirty();
    control.setErrors(errors);
    await rerender({ partialUpdate: true });
    expect(screen.getByRole('textbox', { name: fieldData.label })).toBeInvalid();
    expect(screen.getByText(new RegExp(`(${errors.foo})|(errors.bar)`))).toBeVisible();
  });
});
