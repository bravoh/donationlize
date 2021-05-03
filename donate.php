<?php
var_dump($_POST);
?>
<form action="https://www.moneybookers.com/app/payment.pl" target="_blank">
    <input type="hidden" name="pay_to_email" value="demoqco@sun-fish.com">
    <input type="hidden" name="return_url" value="return_url.php">
    <input type="hidden" name="return_url_target" value="1">
    <input type="hidden" name="cancel_url" value="cancel_url.php">
    <input type="hidden" name="cancel_url_target" value="1">
    <input type="hidden" name="status_url" value="status_url.php">
    <input type="hidden" name="dynamic_descriptor" value="Descriptor">
    <input type="hidden" name="language" value="EN">
    <input type="hidden" name="confirmation_note" value="Samplemerchant wishes you pleasure reading your new book!">
    <input type="hidden" name="merchant_fields" value="field1">
    <input type="hidden" name="title" value="Mr">
    <input type="hidden" name="firstname" value="John">
    <input type="hidden" name="lastname" value="Payer">
    <input type="hidden" name="address" value="11 Payerstr St">
    <input type="hidden" name="address2" value="Payertown">
    <input type="hidden" name="phone_number" value="0207123456">
    <input type="hidden" name="postal_code" value="EC45MQ">
    <input type="hidden" name="city" value="Payertown">
    <input type="hidden" name="state" value="Central London">
    <input type="hidden" name="country" value="GBR">
    <input type="hidden" name="amount" value="39.60">
    <input type="hidden" name="currency" value="EUR">
    <input type="hidden" name="amount2_description" value="Product Price:">
    <input type="hidden" name="amount2" value="29.90">
    <input type="hidden" name="amount3_description" value="Handling Fees:">
    <input type="hidden" name="amount3" value="3.10">
    <input type="hidden" name="amount4_description" value="VAT (20%):">
    <input type="hidden" name="amount4" value="6.60">
    <input type="hidden" name="detail1_description" value="Product ID:">
    <input type="hidden" name="detail1_text" value="4509334">
    <input type="hidden" name="detail2_description" value="Description:">
    <input type="hidden" name="detail2_text" value="Romeo and Juliet (W. Shakespeare)">
    <input type="hidden" name="detail3_description" value="Seller ID:">
    <input type="hidden" name="detail3_text" value="123456">
    <input type="hidden" name="detail4_description" value="Special Conditions:">
    <input type="hidden" name="detail4_text" value="5-6 days for delivery">
    <input type="hidden" name="rec_period" value="1">
    <input type="hidden" name="rec_grace_period" value="1">
    <input type="hidden" name="rec_cycle" value="day">
    <input type="hidden" name="ondemand_max_currency" value="USD">
    <input type="submit" name="Pay" value="Pay">
</form>
