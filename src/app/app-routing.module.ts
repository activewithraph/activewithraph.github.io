import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { BlogPostComponent } from "./components/blog/blog-post/blog-post.component";
import { BlogComponent } from "./components/blog/blog.component";
import { TrainComponent } from "./components/train/train.component";
import { HomeComponent } from "./components/home/home.component";
import { MeComponent } from "./components/me/me.component";
import { NutritionComponent } from "./components/nutrition/nutrition.component";
import { ToolsComponent } from "./components/tools/tools.component";
import { StoryComponent } from "./components/story/story.component";
import { ToolsCaloriesComponent } from "./components/tools-calories/tools-calories.component";
import { ToolsHeartRateComponent } from "./components/tools-heart-rate/tools-heart-rate.component";
import { ToolsBmiComponent } from "./components/tools-bmi/tools-bmi.component";

const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "home", component: HomeComponent },
  { path: "me", component: MeComponent },
  { path: "story", component: StoryComponent },
  { path: "blog", component: BlogComponent },
  { path: "blog/post/:id", component: BlogPostComponent },
  { path: "site/blog/post/:id", component: BlogPostComponent },
  { path: "train", component: TrainComponent },
  { path: "nutrition", component: NutritionComponent },
  { path: "tools", component: ToolsComponent },
  { path: "tools/calories", component: ToolsCaloriesComponent },
  { path: "tools/heart-rate-zones", component: ToolsHeartRateComponent },
  { path: "tools/bmi", component: ToolsBmiComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'top',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
