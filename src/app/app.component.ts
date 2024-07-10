import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { catchError } from 'rxjs/internal/operators/catchError';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatIconModule, MatButtonModule, MatListModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  sourceRepos: Repository[] = [];
  localRepos: Repository[] = [];
  public processing = false;

  constructor(private http: HttpClient) {
    this.getRepos();
    this.getSourceRepos();
  };

  public getSourceRepos(){
    this.processing = true;
    this.http
    .get<Repository[]>('http://localhost:8080/all/repos', {
    })
    .subscribe(response => {
      this.sourceRepos = response;
      this.processing = false;
    });
  }

  public getRepos(){
    this.processing = true;
    this.http
    .get<Repository[]>('http://localhost:8080/all/localRepos', {
    })
    .subscribe(response => {
      this.localRepos = response;
      this.processing = false;
    });
  }

  public syncWithTarget(repo:Repository){
    this.sync(repo, 'http://localhost:8080/solitary/target');
  }

  public syncWithSource(repo:Repository){
    this.sync(repo, 'http://localhost:8080/solitary/source');
  }

  public async sync(repo:Repository, url:string){
    this.processing = true;
    repo.status = -1;
    this.http.post<any>(url, repo.name, {observe:'response'})
    .pipe(catchError((error: any, caught: Observable<any>): Observable<any> => {
      console.error('There was an error!', error);
      repo.status = 400;
      this.processing = false;
      return new Observable<any>();
  }))
    .subscribe(
      response => {
        repo.status = response.status;
        this.processing = false;
      }
    );
  }

  public async syncAllWithSource(){
    for(let repo of this.sourceRepos){
      this.processing = true;
      this.sync(repo, 'http://localhost:8080/solitary/source');
    }
  }

  public async syncAllWithTarget(){
    for(let repo of this.localRepos){
      this.processing = true;
      this.sync(repo, 'http://localhost:8080/solitary/target');
    }
  }

}

class Repository{
  name: string;
  status: number;

  constructor(name: string){
    this.name = name;
    this.status = -1;
  }
}
