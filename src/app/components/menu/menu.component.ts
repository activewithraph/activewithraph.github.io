import { Component, Input, TemplateRef } from "@angular/core";
import { NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-menu",
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss"],
})
export class MenuComponent {
  public constructor(private offcanvasService: NgbOffcanvas) {}

  @Input()
  public isHomeSelected: boolean = false;

  @Input()
  public isMeSelected: boolean = false;

  @Input()
  public isTrainSelected: boolean = false;

  @Input()
  public isNutritionSelected: boolean = false;

  @Input()
  public isBlogSelected: boolean = false;

  @Input()
  public isToolsSelected: boolean = false;
  
  @Input()
  public isDonateSelected: boolean = false;

  @Input()
  public isContactSelected: boolean = false;

  public open(content: TemplateRef<any>): void {
    this.offcanvasService.open(content, { position: "end" });
  }
}
