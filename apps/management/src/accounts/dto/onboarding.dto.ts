import { OnboardingState } from "@lib/thuso-common";
import { IsEnum, IsString } from "class-validator";

export class OnboardingDto {
    @IsString()
    @IsEnum(OnboardingState)
    next: OnboardingState
}