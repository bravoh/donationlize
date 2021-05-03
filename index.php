<!DOCTYPE html>
<html lang="en">
<?php include "header.php" ?>
<body id>
<div id="main">
    <div class="container">
        <div id="subnav"></div>
        <div class="row">
            <div class="col-md-10 col-md-offset-1 col-lg-8 col-lg-offset-2">
                <h2>Donate to <a href="https://bcp-a.org">Borders Community Peacenet Africa</a></h2>
                <p>We need your help to reach our funding goal.</p>
                <p>Please select or input an amount:</p>
                <form action="https://www.moneybookers.com/app/payment.pl" target="_blank">
                    <input type="hidden" name="currency" value="USD">
                    <div class="form-group">
                        <input type="hidden" name="pay_to_email" value="demoqco@sun-fish.com">
                        <input type="hidden" name="return_url" value="https://bcp-a.org/donations/thankyou.php">
                        <input type="hidden" name="return_url_target" value="1">
                        <input type="hidden" name="cancel_url" value="https://bcp-a.org/donate">
                        <input type="hidden" name="cancel_url_target" value="1">
                        <input type="hidden" name="status_url" value="https://bcp-a.org/donations/status.php">
                        <input type="hidden" name="dynamic_descriptor" value="Descriptor">
                        <input type="hidden" name="language" value="EN">
                        <input type="hidden" name="confirmation_note" value="Thank you for donating to BCP-A!">
                        <input type="hidden" name="merchant_fields" value="field1">
                        <input type="hidden" name="title" value="Mr">

                        <div class="form-group">
                            <p>First Name</p>
                            <input type="text" name="firstname" class="form-control" placeholder="First Name">
                        </div>
                        <div class="form-group">
                            <p>Last Name</p>
                            <input type="text" name="lastname" class="form-control" placeholder="Last Name">
                        </div>

                        <div class="form-group">
                            <p>Email Address</p>
                            <input name="sign-in.email" type="email" autocomplete="email" class="form-control" required="" pattern=".*@.*" placeholder="Email">
                        </div>

                        <input type="hidden" name="address" value="11 Payerstr St">
                        <input type="hidden" name="address2" value="Payertown">
                        <input type="hidden" name="phone_number" value="0207123456">
                        <input type="hidden" name="postal_code" value="EC45MQ">
                        <input type="hidden" name="city" value="Payertown">
                        <input type="hidden" name="state" value="Central London">
                        <input type="hidden" name="country" value="GBR">
                        <!--
                        <input type="hidden" name="amount2_description" value="Product Price:">
                        <input type="hidden" name="amount2" value="29.90">

                        <input type="hidden" name="amount3_description" value="Handling Fees:">
                        <input type="hidden" name="amount3" value="3.10">

                        <input type="hidden" name="amount4_description" value="VAT (20%):">
                        <input type="hidden" name="amount4" value="6.60">
                        -->
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

                        <!--<input type="hidden" name="amount" value="39.60">-->
                        <br/>
                        <ul class="list-group radio-group">
                            <li class="list-group-item">
                                <label>
                                    <input type="radio" name="amount" value="10">
                                    <div class="radio-label">
<!--                                        <h5 class="list-group-item-heading">Symbolic</h5>-->
                                        <p class="list-group-item-text">$10</p>
                                    </div>
                                </label>
                            </li>
                            <li class="list-group-item">
                                <label>
                                    <input type="radio" name="amount" value="20">
                                    <div class="radio-label">
<!--                                        <h5 class="list-group-item-heading">Small</h5>-->
                                        <p class="list-group-item-text">$20</p>
                                    </div>
                                </label>
                            </li>
                            <li class="list-group-item">
                                <label>
                                    <input type="radio" name="amount" value="50.00">
                                    <div class="radio-label">
<!--                                        <h5 class="list-group-item-heading">Medium</h5>-->
                                        <p class="list-group-item-text">$50</p>
                                    </div>
                                </label>
                            </li>
                            <li class="list-group-item">
                                <label>
                                    <input type="radio" name="amount" value="100.00">
                                    <div class="radio-label">
<!--                                        <h5 class="list-group-item-heading">Large</h5>-->
                                        <p class="list-group-item-text">$100</p>
                                    </div>
                                </label>
                            </li>
                            <li class="list-group-item">
                                <label>
                                    <input type="radio" name="amount" value="500.00">
                                    <div class="radio-label">
<!--                                        <h5 class="list-group-item-heading">Maximum</h5>-->
                                        <p class="list-group-item-text">$ 500</p>
                                    </div>
                                </label>
                            </li>
                            <li class="list-group-item">
                                <label>
<!--                                    <input type="radio" id="custom-amount-radio" name="amount" value="99" required>-->
                                    <div class="radio-label">
                                        <h5 class="list-group-item-heading">Custom Amount</h5>
                                        <div class="form-inline inline-block">
                                            <div class="input-group ">
                                                <div class="input-group-addon">$</div>
<!--                                                <input type="hidden" name="currency" value="EUR">-->
                                                <input type="tel" inputmode="decimal" name="amount" id="amount" placeholder="Amount" class="amount form-control " data-required-if-checked="#custom-amount-radio" value>
                                            </div>
                                        </div>

                                    </div>
                                </label>
                            </li>
                        </ul>

                        <p class="banderole default" style="display: block">
                            <input type="checkbox" required> I agree to <a href="https://bcp-a.org">Borders Community Peacenet Africa</a> Privacy Policy
                        </p>

                        <button class="btn btn-primary btn-lg btn-block">Donate</button>
                        <p class="text-center">
                            <span class="payment-icons" title="Donations to Liberapay can be paid using: a credit or debit card (Visa, MasterCard, American Express), a Euro bank account (SEPA Direct Debit), or a PayPal account." data-toggle="tooltip" data-placement="bottom">
                                <span class="fa fa-credit-card" aria-hidden="true"></span>
                                <span class="fa fa-bank" aria-hidden="true"></span>
<!--                                <span class="fa fa-skril" aria-hidden="true"></span>-->
                            </span>
                        </p>
                    </div>
                </form>

                <!--
                <br>
                <h3>Frequently Asked Questions</h3>

                <h4>What payment methods are available?</h4>
                <p>Donations to Liberapay can be paid using: a credit or debit card (Visa, MasterCard, American Express), a Euro bank account (SEPA Direct Debit), or a PayPal account.
                </p>

                <h4>How do recurrent donations work?</h4>
                <p>On Liberapay, donations are funded in advance. You have control over when and how much you pay. Sending more money at once usually results in a lower percentage of <a href="/about/faq#fees">transaction fees</a>.</p>
                <p>We will notify you whenever a donation needs to be renewed. If you&#39;ve opted for automatic renewals, then we will attempt to debit your card or bank account as agreed.</p>

                <h4>Can I make a one-time donation?</h4>
                <p>One-time donations aren&#39;t properly supported yet, but you can discontinue your donation immediately after the first payment.</p>

                <h4>What is this website? I don&#39;t recognize it.</h4>
                <p>You&#39;re on Liberapay, a donation platform maintained by a non-profit organisation based in France.</p>

                <h4>Is this platform secure?</h4>
                <p>Liberapay has been running for 5 years without any significant security incident. We do everything we can to keep your data safe and comply with the laws of the European Union (<abbr title="General Data Protection Regulation">GDPR</abbr>, <abbr title="Revised Payment Services Directive">PSD2</abbr>, et cetera).</p>
                -->
            </div>
        </div>
    </div>
</div>
<?php include "scripts.php" ?>
</body>
</html>
