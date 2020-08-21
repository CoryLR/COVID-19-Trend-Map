import { Component, OnInit } from '@angular/core';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

  /* Font Awesome */
  faLink = faLink;

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {

    /* Note page view */
    const url = '/api/note/page';
    const body = {label: "about"};
    const viewStatusReportObservable = this.http.post(url, body).subscribe((res: any) => {
      viewStatusReportObservable.unsubscribe();
    });
  
  }

}
