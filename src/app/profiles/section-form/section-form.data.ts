import {
  FormGroup,
  Validators,
  ValidatorFn,
  FormControl,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Slug, SectionFormData } from '../profiles.types';
import { FieldType } from '../../form-field';

const urlValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const urlRegex = /^(https?:\/\/)([\w.-]+\.[a-zA-Z]{2,})(\/[\w.-]*)*\/?\??$/;
  return control.value && !urlRegex.test(control.value)
    ? { validation: 'Enter a valid URL.' }
    : null;
};

const createTextControl = (validators: ValidatorFn[] = []) => {
  return new FormControl('', { nonNullable: true, validators: validators });
};

const createTextControlRequired = (validators: ValidatorFn[] = []) => {
  return createTextControl([Validators.required, ...validators]);
};

const createUrlControl = (validators: ValidatorFn[] = []) => {
  return createTextControl([urlValidator, ...validators]);
};

const createUrlControlRequired = (validators: ValidatorFn[] = []) => {
  return createTextControlRequired([urlValidator, ...validators]);
};

const createDateControls = () => {
  return {
    start_date: createTextControlRequired(),
    end_date: new FormControl<string | null>(null),
  };
};

type DateControls = ReturnType<typeof createDateControls>;

const createFieldId = (slug: Slug, label: string) => {
  return (
    (slug.endsWith('/') ? slug : slug + '/').replace(/\//g, '-') +
    'section-form-' +
    label.toLowerCase().replace(/ /g, '-') +
    '-' +
    (Date.now() % 100000)
  );
};

const createField = <TControl extends FormControl>(
  control: TControl,
  slug: Slug,
  label: string,
  type: FieldType = 'text',
) => {
  return { id: createFieldId(slug, label), label, type, control };
};

const createDateFields = <T extends Record<string, FormControl> & DateControls>(
  form: FormGroup<T>,
  slug: Slug,
) => {
  return [
    createField(form.controls.start_date as DateControls['start_date'], slug, 'Start Date', 'date'),
    createField(form.controls.end_date as DateControls['end_date'], slug, 'End Date', 'date'),
  ];
};

export const sectionFormDataFactory: Record<Slug, () => SectionFormData> = {
  [Slug.LINK]: () => {
    const form = new FormGroup({
      href: createUrlControlRequired(),
      label: createTextControl(),
    });

    const fields = [
      createField(form.controls.href, Slug.LINK, 'URL'),
      createField(form.controls.label, Slug.LINK, 'Label'),
    ];

    return { form, fields };
  },

  [Slug.SKILL]: () => {
    const slug = Slug.SKILL;

    const form = new FormGroup({
      name: createTextControlRequired(),
      keywords: createTextControl(),
    });

    const fields = [
      createField(form.controls.name, slug, 'name'),
      createField(form.controls.keywords, slug, 'Keywords (comma separated)'),
    ];

    return { form, fields };
  },

  [Slug.EDUCATION]: () => {
    const slug = Slug.EDUCATION;

    const form = new FormGroup({
      title: createTextControlRequired(),
      summary: createTextControl(),
      ...createDateControls(),
    });

    const fields = [
      createField(form.controls.title, slug, 'Subject'),
      createField(form.controls.summary, slug, 'Summary'),
      ...createDateFields(form, slug),
    ];

    return { form, fields };
  },

  [Slug.WORK_EXPERIENCE]: () => {
    const slug = Slug.WORK_EXPERIENCE;

    const form = new FormGroup({
      position: createTextControlRequired(),
      company: createTextControlRequired(),
      location: createTextControl(),
      summary: createTextControl(),
      ...createDateControls(),
    });

    const fields = [
      createField(form.controls.position, slug, 'Position'),
      createField(form.controls.company, slug, 'Company'),
      createField(form.controls.location, slug, 'Location'),
      createField(form.controls.summary, slug, 'Summary'),
      ...createDateFields(form, Slug.WORK_EXPERIENCE),
    ];

    return { form, fields };
  },

  [Slug.PROJECT]: () => {
    const slug = Slug.PROJECT;

    const form = new FormGroup({
      title: createTextControlRequired(),
      href: createUrlControl(),
      summary: createTextControl(),
      keywords: createTextControl(),
      ...createDateControls(),
    });

    const fields = [
      createField(form.controls.title, slug, 'Name'),
      createField(form.controls.href, slug, 'URL'),
      createField(form.controls.summary, slug, 'Summary'),
      createField(form.controls.keywords, slug, 'Keywords (comma separated)'),
      ...createDateFields(form, Slug.PROJECT),
    ];

    return { form, fields };
  },

  [Slug.COURSE]: () => {
    const slug = Slug.COURSE;

    const form = new FormGroup({
      name: createTextControlRequired(),
      academy: createTextControlRequired(),
      href: createUrlControl(),
      ...createDateControls(),
    });

    const fields = [
      createField(form.controls.name, slug, 'Name'),
      createField(form.controls.academy, slug, 'Academy'),
      createField(form.controls.href, slug, 'URL'),
      ...createDateFields(form, Slug.COURSE),
    ];

    return { form, fields };
  },
};
