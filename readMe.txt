![alt text](./assets/amount-suggestion.png)

autoformat amount component is a combination of both p-inputNumber and p-autoComplete (PRIMENG components).
Limited features are enabled and merged.

Based on my requirement,

When user keyin a number,
(at component level where autoformatamount is used)
amount format suggestions declared will be shown as dropdown by appending the number keyedin.

Once user select a format,
The value based on selected format will be populated in the input.

For example:
Step 1: Amount formats declared

//.ts
  autoAmounts= [
    {label: 'Thousand', value: '000'},
    {label: 'Million', value: '000000'},
    {label: 'Billion', value: '000000000'}
  ]
  getAmountFormats(event) {
    //resetting to original as query values are appended on every event trigger
    this.resetautoAmounts();
    let query = null;
    let filtered : any[] = [];
    query = event.query;

    //looping all the amount formats and appending to number entered
    for(let i = 0; i < this.autoAmounts.length; i++) {
      let amounts = this.autoAmounts[i];
      amounts.label = query+' '+amounts.label;
      amounts.value = query+amounts.value;
      filtered.push(amounts);
    }

    this.filteredAmount = filtered;
   }
//.html
   <p-autoformat-amount mode="decimal" [formControlName]="i" (onInput)="selectedAmount" [suggestions]="filteredAmount"
   (completeMethod)="getAmountFormats($event)" [minLength]="1" field="label"></p-autoformat-amount>

Step 2: Now, When user keyin number 25 in the inputfield, user can see dropdown suggestions as
        25 Thousand, 25 Million, 25 Billion
Step 3: Once user select a suggestion, let's say 25 Thousand, the number which user entered (25) and the value
        of it's label in the declared format will be populated in the input which is 25,000
