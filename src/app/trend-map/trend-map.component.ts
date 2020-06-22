import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-trend-map',
  templateUrl: './trend-map.component.html',
  styleUrls: ['./trend-map.component.scss']
})
export class TrendMapComponent implements OnInit {

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    const url = '/api/getData';
    const body = {test: "test"};
    this.http.post(url, body).subscribe((data: any) => {
      console.log(url, data);
    });
  }

}
