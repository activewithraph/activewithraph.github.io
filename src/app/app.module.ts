import { HttpClient, HttpClientModule } from "@angular/common/http";
import { ToolsHeartRateComponent } from "./components/tools-heart-rate/tools-heart-rate.component";
import { HeartRateCalculatorComponent } from "./components/heart-rate-calculator/heart-rate-calculator.component";
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { MarkdownModule } from "ngx-markdown";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BlogPostComponent } from "./components/blog/blog-post/blog-post.component";
import { BlogComponent } from "./components/blog/blog.component";
import { CalorieCalculatorComponent } from "./components/calorie-calculator/calorie-calculator.component";
import { TrainComponent } from "./components/train/train.component";
import { FooterComponent } from "./components/footer/footer.component";
import { HomeComponent } from "./components/home/home.component";
import { MeComponent } from "./components/me/me.component";
import { MenuComponent } from "./components/menu/menu.component";
import { SocialMediaLinkComponent } from "./components/social-media-links/social-media-links.component";
import { StoryComponent } from "./components/story/story.component";
import { NutritionComponent } from "./components/nutrition/nutrition.component";
import { ToolsComponent } from "./components/tools/tools.component";
import { ToolsCaloriesComponent } from "./components/tools-calories/tools-calories.component";
import { ToolsBmiComponent } from "./components/tools-bmi/tools-bmi.component";
import { BmiCalculatorComponent } from "./components/bmi-calculator/bmi-calculator.component";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    MeComponent,
    StoryComponent,
    TrainComponent,
    NutritionComponent,
    ToolsComponent,
    ToolsCaloriesComponent,
    MenuComponent,
    FooterComponent,
    SocialMediaLinkComponent,
    BlogComponent,
    BlogPostComponent,
    ToolsHeartRateComponent,
    ToolsBmiComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    NgbModule,
    CalorieCalculatorComponent,
    HeartRateCalculatorComponent,
    BmiCalculatorComponent,
    MarkdownModule.forRoot({ loader: HttpClient }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
