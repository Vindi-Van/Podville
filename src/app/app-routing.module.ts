import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { HostComponent } from './pages/host/host.component';
import { ListenerComponent } from './pages/listener/listener.component';

const routes: Routes = [
  { path: 'host', component: HostComponent },
  { path: 'listener', component: ListenerComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
