pragma solidity >= 0.5.4 <= 0.7.0;

contract Point {

    modifier checkOwnerAndAccept {
        require(msg.pubkey() == tvm.pubkey(), 100);
		tvm.accept();
		_;
	}

    function mail() external pure {
        Point(msg.sender).mail();
    }

    function sendTransaction(address dest, uint128 value, bool bounce) public view checkOwnerAndAccept {
        require(value > 0 && value < address(this).balance, 101);
        dest.transfer(value, bounce, 0);
    }

}

