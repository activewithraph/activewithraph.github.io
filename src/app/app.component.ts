import { Component } from "@angular/core";
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  constructor(router: Router) {
    router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo(0, 0);
        // If the page scrolls inside an element instead of the window, reset that one too:
        // document.querySelector('.your-scroll-container')?.scrollTo(0, 0);
      });
  }
}
