import { FormControl, FormGroup } from '@angular/forms';
import { FieldType } from '../form-field';

export interface Base {
  id: number;
}

export interface SectionBase extends Base {
  profile: Profile['id'];
  order: number;
}

export interface TimedSectionBase extends SectionBase {
  start_date: string;
  end_date: string;
}

export interface Profile extends Base {
  bio: string;
  tel: string;
  name: string;
  title: string;
  email: string;
  public: boolean;
  location: string;
  username: string;
}

export interface Link extends SectionBase {
  href: string;
  label: string;
}

export interface Skill extends SectionBase {
  name: string;
  keywords: string;
}

export interface Education extends TimedSectionBase {
  title: string;
  summary: string;
}

export interface WorkExperience extends TimedSectionBase {
  company: string;
  position: string;
  location: string;
  summary: string;
}

export interface Project extends TimedSectionBase {
  title: string;
  href: string;
  summary: string;
  keywords: string;
}

export interface Course extends TimedSectionBase {
  academy: string;
  name: string;
  href: string;
}

export type SectionEntry = Link | Skill | Education | WorkExperience | Project | Course;

export enum Slug {
  LINK = 'links/',
  SKILL = 'skills/',
  EDUCATION = 'educations/',
  WORK_EXPERIENCE = 'works/',
  PROJECT = 'projects/',
  COURSE = 'courses/',
}

export interface SectionData<S = SectionEntry> {
  slug: Slug;
  entries: S[];
  error: string;
  loading: boolean;
}

export interface Sections {
  [Slug.LINK]: SectionData<Link>;
  [Slug.SKILL]: SectionData<Skill>;
  [Slug.EDUCATION]: SectionData<Education>;
  [Slug.WORK_EXPERIENCE]: SectionData<WorkExperience>;
  [Slug.PROJECT]: SectionData<Project>;
  [Slug.COURSE]: SectionData<Course>;
}

export interface SectionFormData {
  form: FormGroup;
  fields: { control: FormControl; id: string; label: string; type: FieldType }[];
}
