/**
 * Question status during test attempt:
 * - NotVisited: Question not yet viewed
 * - NotAnswered: Viewed but not answered
 * - Answered: Answered but not marked for review
 * - Marked: Marked for review but not answered
 * - AnsweredMarked: Both answered and marked for review
 */
export enum QuestionStatus {
  NotVisited,
  NotAnswered,
  Answered,
  Marked,
  AnsweredMarked,
}
