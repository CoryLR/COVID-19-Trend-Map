import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-trend-map',
  templateUrl: './trend-map.component.html',
  styleUrls: ['./trend-map.component.scss']
})
export class TrendMapComponent implements OnInit {

  constructor(private http: HttpClient) { }

  ngOnInit(): void {

}
