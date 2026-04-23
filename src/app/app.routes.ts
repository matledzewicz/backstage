import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard';
import { MeetupDetailComponent } from './features/meetup-detail/meetup-detail';
import { PipelineComponent } from './features/pipeline/pipeline';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'meetup/:id', component: MeetupDetailComponent },
  { path: 'pipeline', component: PipelineComponent },
  { path: '**', redirectTo: 'dashboard' },
];
