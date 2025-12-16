use anchor_lang::{
    prelude::*, 
    system_program::{Transfer, transfer}
};

use crate::{
    constants::{LOTTERY_STATE_SEED, POT_VAULT_SEED, USER_RECEIPT_SEED, USER_TICKET_SEED}, 
    errors::HashtrologyErrors, 
    state::{LotteryState, UserEntryReceipt, UserTicket}
};

#[derive(Accounts)]
pub struct EnterLottery<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [LOTTERY_STATE_SEED],
        bump = lottery_state.lottery_state_bump
    )]
    pub lottery_state: Account<'info, LotteryState>,

    /// CHECK: This is the PDA vault that will hold the SOL prize pot.
    #[account(
        mut,
        seeds = [POT_VAULT_SEED],
        bump = lottery_state.pot_vault_bump
    )] 
    pub pot_vault: AccountInfo<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + UserEntryReceipt::INIT_SPACE,
        seeds = [USER_RECEIPT_SEED,user.key().as_ref(), &lottery_state.current_lottery_id.to_le_bytes()],
        bump
    )]
    pub user_entry_receipt: Account<'info, UserEntryReceipt>,

    #[account(
        init,
        payer = user,
        space = 8 + UserTicket::INIT_SPACE,
        seeds = [USER_TICKET_SEED, &lottery_state.current_lottery_id.to_le_bytes(), &lottery_state.total_participants.to_le_bytes()],
        bump
    )]
    pub user_ticket: Account<'info, UserTicket>,

    pub system_program: Program<'info, System> 
}

impl<'info> EnterLottery<'info> {
    pub fn enter_lottery_handler(&mut self) -> Result<()> { 

        let lottery_state = &mut self.lottery_state;

        require!(
            !lottery_state.is_drawing,
            HashtrologyErrors::LotteryIsDrawing
        );

        let ticket_number = lottery_state.total_participants.checked_add(1).ok_or(HashtrologyErrors::Overflow)?;

        self.user_entry_receipt.set_inner(UserEntryReceipt { 
            user: self.user.key(), 
            lottery_id: lottery_state.current_lottery_id, 
            ticket_number 
        });

        self.user_ticket.set_inner(UserTicket { 
            user: self.user.key(), 
            lottery_id: lottery_state.current_lottery_id,
            is_winner: false,
            prize_amount: 0,
            is_claimed: false 
        });

        let accounts = Transfer {
            from: self.user.to_account_info(),
            to: self.pot_vault.to_account_info() 
        };

        let cpi_ctx = CpiContext::new(self.system_program.to_account_info(), accounts);

        transfer(cpi_ctx, lottery_state.ticket_price)?;

        lottery_state.total_participants = lottery_state.total_participants.checked_add(1).ok_or(HashtrologyErrors::Overflow)?;

        msg!(
            "Ticket #{} purchased for lottery #{}",
            ticket_number,
            lottery_state.current_lottery_id
        );
        
        Ok(())
    }
}